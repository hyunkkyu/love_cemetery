import mongoose, { Schema } from "mongoose"

const PostSchema = new Schema({
  userId: { type: String, required: true, index: true },
  nickname: { type: String, required: true },
  category: { type: String, enum: ["talk", "saju", "advice", "match"], required: true },
  title: { type: String, required: true, maxlength: 50 },
  content: { type: String, required: true, maxlength: 5000 },
  tags: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  viewCount: { type: Number, default: 0 },
  attachedSaju: Schema.Types.Mixed,
  attachedCompatibility: Schema.Types.Mixed,
}, { timestamps: true })

PostSchema.index({ category: 1, createdAt: -1 })
PostSchema.index({ createdAt: -1 })

const CommentSchema = new Schema({
  postId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  nickname: { type: String, required: true },
  content: { type: String, required: true, maxlength: 1000 },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
}, { timestamps: true })

CommentSchema.index({ postId: 1, createdAt: 1 })

const SajuProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  birthDate: String,
  birthTime: String,
  dominantElement: String,
  elementBalance: Schema.Types.Mixed,
  mbti: { type: String, index: true },
  ilju: { type: String, index: true },
  lookingFor: { type: String, maxlength: 200 },
  introduction: { type: String, maxlength: 500 },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true })

SajuProfileSchema.index({ dominantElement: 1, isPublic: 1 })
SajuProfileSchema.index({ mbti: 1 })
SajuProfileSchema.index({ ilju: 1 })

export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema)
export const Comment = mongoose.models.Comment || mongoose.model("Comment", CommentSchema)
export const SajuProfile = mongoose.models.SajuProfile || mongoose.model("SajuProfile", SajuProfileSchema)
