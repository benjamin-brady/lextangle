import { relations } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const puzzleFeedback = sqliteTable('puzzle_feedback', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	createdAt: integer('created_at').notNull(),
	puzzleId: text('puzzle_id').notNull(),
	puzzleKind: text('puzzle_kind').notNull(),
	sentiment: text('sentiment').notNull(), // 'up' | 'down'
	reason: text('reason'), // null for thumbs-up
	comment: text('comment'),
	userHash: text('user_hash').notNull(),
	country: text('country'),
	appVersion: text('app_version'),
	tsScore: real('ts_score'),
	tsAction: text('ts_action')
});

export const puzzleFeedbackEdges = sqliteTable(
	'puzzle_feedback_edges',
	{
		feedbackId: integer('feedback_id')
			.notNull()
			.references(() => puzzleFeedback.id, { onDelete: 'cascade' }),
		edgeFrom: integer('edge_from').notNull(),
		edgeTo: integer('edge_to').notNull(),
		wordFrom: text('word_from').notNull(),
		wordTo: text('word_to').notNull(),
		clueSnapshot: text('clue_snapshot').notNull()
	},
	(t) => [primaryKey({ columns: [t.feedbackId, t.edgeFrom, t.edgeTo] })]
);

export const puzzleFeedbackRelations = relations(puzzleFeedback, ({ many }) => ({
	flaggedEdges: many(puzzleFeedbackEdges)
}));

export const puzzleFeedbackEdgesRelations = relations(puzzleFeedbackEdges, ({ one }) => ({
	feedback: one(puzzleFeedback, {
		fields: [puzzleFeedbackEdges.feedbackId],
		references: [puzzleFeedback.id]
	})
}));
