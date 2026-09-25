// These opt-in URL flags belong to the personal Android wrapper, not saved projects.
export const getMobileOptions = () => {
  const params = new URLSearchParams(parent.location.search);
  return {
    keyboardToolbar: params.get('keyboardToolbar') === 'true',
    consoleInput: params.get('consoleInput') !== 'false',
  };
};
