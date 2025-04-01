(function () {
    'use strict';

    const jsxCode = `
const TextArea = ({ text, setText, placeholder, disabled = false }) => (
  <>
    <div style={{ width: '100%' }}>
      <label className="svelte-1f354aw container">
        <textarea
          className="svelte-1f354aw scroll-hide"
          placeholder={placeholder}
          style={{ overflowY: 'auto', height: 84 }}
          value={text}
          onChange={event => setText(event.target.value)}
          disabled={disabled}
        />
      </label>
    </div>
  </>
);

const Button = ({ text, onClick, ...props }) => (
  <button
    style={{ marginTop: 8, width: 'max-content' }}
    className="lg primary gradio-button svelte-cmf5ev"
    onClick={onClick}
    {...props}
  >
    {text}
  </button>
);

let generateFlag = false;

const generateImages = savedPrompts => new Promise(async resolve => {
  for (const savedPrompt of savedPrompts) {
    for (let i = 0; i < savedPrompt.count; ++i) {
      const positivePromptTextArea = document.querySelector('#txt2img_prompt textarea');
      const negativePromptTextArea = document.querySelector('#txt2img_neg_prompt textarea');

      const prevPositivePromptTextArea = positivePromptTextArea.value
      const prevNegativePromptTextArea = negativePromptTextArea.value

      positivePromptTextArea.value = savedPrompt.positiveText;
      negativePromptTextArea.value = savedPrompt.negativeText;

      if (prevPositivePromptTextArea !== savedPrompt.positiveText) {
        positivePromptTextArea.dispatchEvent(new Event('input', { bubbles: true }));
        positivePromptTextArea.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (prevNegativePromptTextArea !== savedPrompt.negativeText) {
        negativePromptTextArea.dispatchEvent(new Event('input', { bubbles: true }));
        negativePromptTextArea.dispatchEvent(new Event('change', { bubbles: true }));
      }

      await new Promise(async innerResolve => {
        if (!generateFlag) {
          innerResolve();
          return;
        }
        const generateBtn = document.querySelector('#txt2img_generate');
        const interruptBtn = document.querySelector('#txt2img_interrupt');

        const checkInterruptBtn = async () => new Promise(resolve => {
          const interval = setInterval(() => {
            if (interruptBtn && window.getComputedStyle(interruptBtn).display === 'none') {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        });

        generateBtn.click();

        await checkInterruptBtn();

        innerResolve();
      });
    }
  }

  resolve();
});

const App = () => {
  const [negativeText, setNegativeText] = React.useState('');
  const [positiveText, setPositiveText] = React.useState('');
  const [savedPrompts, setSavedPrompts] = React.useState([]);
  const [count, setCount] = React.useState(1);
  const [defaultCount, setDefaultCount] = React.useState(1);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const addPrompt = () => {
    setSavedPrompts([
      ...savedPrompts,
      {
        negativeText,
        positiveText,
        count
      }
    ]);

    setPositiveText('');
    setNegativeText('');
    setCount(defaultCount);
  };

  const removePrompt = index => {
    setSavedPrompts([
      ...savedPrompts.slice(0, index),
      ...savedPrompts.slice(index + 1)
    ]);
  };

  const startGenerating = async () => {
    setIsGenerating(true);
    generateFlag = true;

    await generateImages(savedPrompts);

    setIsGenerating(false);
    generateFlag = false;
  };

  const stopGenerating = () => {
    setIsGenerating(false);
    generateFlag = false;
  };

  const onChangeCount = event => {
    if (event.target.value < 0) {
      return;
    }

    setCount(event.target.value);
  };

  const onChangeDefaultCount = event => {
    if (event.target.value < 0) {
      return;
    }

    setDefaultCount(event.target.value);
    setCount(event.target.value);
  };

  return (
    <>
      <div className="block gradio-accordion input-accordion" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TextArea text={positiveText} setText={setPositiveText} placeholder="Positive" />
        <TextArea text={negativeText} setText={setNegativeText} placeholder="Negative" />
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <label className="block svelte-pjtc3 container">
            <span className="svelte-1gfkn6j">
              Count
            </span>
            <input onChange={onChangeCount} value={count} type="number" className="svelte-pjtc3" />
          </label>
          <label className="block svelte-pjtc3 container">
            <span className="svelte-1gfkn6j">
              Default Count
            </span>
            <input onChange={onChangeDefaultCount} value={defaultCount} type="number" className="svelte-pjtc3" />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={addPrompt} text="Add" disabled={isGenerating} />
          {!isGenerating && <Button onClick={startGenerating} text="Start" disabled={!savedPrompts.length} />}
          {isGenerating && <Button onClick={stopGenerating} text="Stop" />}
        </div>
      </div>
      {savedPrompts.map(({ positiveText, negativeText, count }, index) => (
        <div className="block gradio-accordion input-accordion">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TextArea disabled text={positiveText} />
            <TextArea disabled text={negativeText} />
            <label className="block svelte-pjtc3 container" style={{ display: 'flex', flexDirection: 'column', width: 'max-content' }}>
              <span className="svelte-1gfkn6j">
                Count
              </span>
              <input
                disabled
                value={count}
                type="number"
                className="svelte-pjtc3"
              />
            </label>
            <Button disabled={isGenerating} onClick={() => removePrompt(index)} text="Remove" />
          </div>
        </div>
      ))}
    </>
  );
};

const waitFor = selector => new Promise(resolve => {
  const observer = new MutationObserver((mutations, obs) => {
    const element = document.querySelector(selector);

    if (element) {
      resolve(element);
      obs.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

waitFor('#txt2img_prompt_container').then(() => {
  const divElem = document.createElement('div');
  const promptContainer = document.getElementById('txt2img_prompt_container');

  promptContainer.appendChild(divElem);

  ReactDOM.createRoot(divElem).render(<App />);
});

    `;

    const compiledCode = Babel.transform(jsxCode, { presets: ['react'] }).code;

    eval(compiledCode);
})();
