import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Vertex')
    .items([
      S.documentTypeListItem('course').title('Courses'),
      S.documentTypeListItem('lesson').title('Lessons'),
      S.divider(),
      S.documentTypeListItem('instructor').title('Instructors'),
      S.documentTypeListItem('category').title('Categories'),
    ])
