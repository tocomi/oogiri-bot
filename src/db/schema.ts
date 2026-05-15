import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const team = pgTable('Team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const odai = pgTable('Odai', {
  id: text('id').primaryKey(),
  teamId: text('teamId').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  dueDate: text('dueDate').notNull(),
  imageUrl: text('imageUrl'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
})

export const kotae = pgTable('Kotae', {
  id: text('id').primaryKey(),
  odaiId: text('odaiId').notNull(),
  content: text('content').notNull(),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
})

export const vote = pgTable('Vote', {
  id: text('id').primaryKey(),
  odaiId: text('odaiId').notNull(),
  kotaeId: text('kotaeId').notNull(),
  rank: integer('rank').notNull(),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
})

export const result = pgTable('Result', {
  id: text('id').primaryKey(),
  odaiId: text('odaiId').notNull(),
  kotaeId: text('kotaeId').notNull(),
  type: text('type').notNull(),
  point: integer('point').notNull(),
  rank: integer('rank').notNull(),
  createdAt: text('createdAt').notNull(),
})
