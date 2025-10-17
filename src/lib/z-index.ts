export const Z_INDEX = {
  sidebar: 100,
  dropdown: 200,
  popover: 1100,
  overlay: 1150,
  drawer: 1200,
  modal: 1300,
} as const

export type ZIndexKey = keyof typeof Z_INDEX

