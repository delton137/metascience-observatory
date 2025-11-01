// https://www.sanity.io/docs/structure-builder-cheat-sheet
// Using type inference to avoid circular dependency issues
export const structure = (S: any) =>
  S.list()
    .title('Content')
    .items(S.documentTypeListItems())
