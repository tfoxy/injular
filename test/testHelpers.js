export const MODULE_NAME = 'testModule';
export const INJULAR_MODULE_NAME = 'injularModule';
export const AUX_MODULE_NAME = 'auxTestModule';

export function createRootElement() {
  const rootElement = document.createElement('div');
  rootElement.style.display = 'none';
  document.body.appendChild(rootElement);
  return rootElement;
}

export function removeRootElement(rootElement) {
  document.body.removeChild(rootElement);
}
