import {type SchemaTypeDefinition} from 'sanity'

import {category} from './category'
import {course} from './course'
import {instructor} from './instructor'
import {lesson} from './lesson'
import {courseModule} from './module'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [course, courseModule, lesson, instructor, category],
}
