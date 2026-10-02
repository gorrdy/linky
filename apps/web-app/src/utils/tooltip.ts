/** Props for a browser tooltip; Tamagui forwards `title` to the DOM on web but leaves it out of its types. */
export const tooltip = (text: string | undefined): object =>
  text === undefined ? {} : { title: text };
