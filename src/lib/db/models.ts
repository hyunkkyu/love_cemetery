import mongoose, { Schema, type Document } from "mongoose"

// 유저 계정
const UserSchema = new Schema({
  nickname: { type: String, required: true, unique: true, minlength: 2, maxlength: 12 },
  email: { type: String, required: true, index: true },
  hashedPassword: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  resetToken: String,
  resetTokenExpiry: Date,
  // 하위 호환용 (기존)
  securityQuestion: String,
  securityAnswer: String,
}, { timestamps: true })

// AI 분석 로그 (모든 AI 호출 자동 저장)
const AiLogSchema = new Schema({
  userId: { type: String, index: true },
  type: { type: String, required: true }, // analyze, manseryeok, love-advice, chat, counsel, ssum
  input: Schema.Types.Mixed,
  output: String,
  model: String,
  tokenEstimate: Number,
}, { timestamps: true })

export const User = mongoose.models.User || mongoose.model("User", UserSchema)
export const AiLog = mongoose.models.AiLog || mongoose.model("AiLog", AiLogSchema)

// 묘비
export interface IGrave extends Document {
  userId: string
  nickname: string
  photo?: string
  grade: string
  birthDate: string
  birthTime?: string
  myBirthDate: string
  myBirthTime?: string
  relationshipStart: string
  relationshipEnd: string
  causeOfDeath: string
  graveReason?: string
  epitaph: string
  persona?: string
  chatSamples?: string[]
  chatAnalysis?: object
  manseryeok?: object
  myManseryeok?: object
  compatibility?: object
}

const GraveSchema = new Schema<IGrave>({
  userId: { type: String, required: true, index: true },
  nickname: { type: String, required: true },
  photo: String,
  grade: { type: String, default: "public" },
  birthDate: String,
  birthTime: String,
  myBirthDate: String,
  myBirthTime: String,
  relationshipStart: String,
  relationshipEnd: String,
  causeOfDeath: String,
  graveReason: String,
  epitaph: String,
  persona: String,
  chatSamples: [String],
  chatAnalysis: Schema.Types.Mixed,
  manseryeok: Schema.Types.Mixed,
  myManseryeok: Schema.Types.Mixed,
  compatibility: Schema.Types.Mixed,
}, { timestamps: true })

// 코인
export interface IUserData extends Document {
  userId: string
  coins: number
  ownedItems: Array<{ itemId: string; purchasedAt: string; equippedOn?: string }>
  itemPositions: Record<string, Array<{ itemId: string; x: number; y: number }>>
  inviteCode?: string
  invitedBy?: string
  inviteCount?: number
}

const UserDataSchema = new Schema<IUserData>({
  userId: { type: String, required: true, unique: true },
  coins: { type: Number, default: 500 },
  ownedItems: { type: [{ itemId: String, purchasedAt: String, equippedOn: String }], default: [] },
  itemPositions: { type: Schema.Types.Mixed, default: {} },
  inviteCode: { type: String, unique: true, sparse: true },
  invitedBy: String,
  inviteCount: { type: Number, default: 0 },
}, { timestamps: true })

// 썸 (현재 만나는 사람)
export interface ICrush extends Document {
  userId: string
  nickname: string
  birthDate: string
  birthTime: string
  persona: string
  chatStyle: string
}

const CrushSchema = new Schema<ICrush>({
  userId: { type: String, required: true, index: true },
  nickname: { type: String, required: true },
  birthDate: String,
  birthTime: String,
  persona: String,
  chatStyle: String,
}, { timestamps: true })

// 분석 기록
export interface IAnalysisRecord extends Document {
  userId: string
  crushName: string
  comparedWith?: string
  score: number
  aiAdvice: string
}

const AnalysisRecordSchema = new Schema<IAnalysisRecord>({
  userId: { type: String, required: true, index: true },
  crushName: { type: String, required: true },
  comparedWith: String,
  score: Number,
  aiAdvice: String,
}, { timestamps: true })

// 채팅 기록
export interface IChatHistory extends Document {
  userId: string
  graveId: string
  messages: Array<{ role: string; text: string; time: string }>
}

const ChatHistorySchema = new Schema<IChatHistory>({
  userId: { type: String, required: true },
  graveId: { type: String, required: true },
  messages: [{ role: String, text: String, time: String }],
}, { timestamps: true })

ChatHistorySchema.index({ userId: 1, graveId: 1 }, { unique: true })

// 영혼의동반자
const SoulPartnerSchema = new Schema({
  fromUserId: { type: String, required: true, index: true },
  fromNickname: { type: String, required: true },
  toUserId: { type: String, required: true, index: true },
  toNickname: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true })

SoulPartnerSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true })

// 묘비 코멘트 (영혼의동반자가 남기는)
const GraveCommentSchema = new Schema({
  graveId: { type: String, required: true, index: true },
  graveOwnerId: { type: String, required: true },
  userId: { type: String, required: true },
  nickname: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
}, { timestamps: true })

// 썸붕 (썸이 깨진 기록)
const SsumBungSchema = new Schema({
  userId: { type: String, required: true, index: true },
  nickname: { type: String, required: true },
  photo: String,
  birthDate: String,
  birthTime: String,
  myBirthDate: String,
  myBirthTime: String,
  duration: String, // 썸 기간 (예: "2개월")
  howWeMet: String, // 만남 경위
  myOpinion: { type: String, maxlength: 2000 }, // 내가 생각하는 썸붕 이유
  signals: [String], // 썸붕 징후들
  lastMessage: String, // 마지막 연락 내용
  persona: String, // 상대 성격/MBTI
  manseryeok: Schema.Types.Mixed,
  myManseryeok: Schema.Types.Mixed,
  compatibility: Schema.Types.Mixed,
  aiAnalysis: String, // AI 분석 결과
}, { timestamps: true })

export const Grave = mongoose.models.Grave || mongoose.model<IGrave>("Grave", GraveSchema)
export const UserData = mongoose.models.UserData || mongoose.model<IUserData>("UserData", UserDataSchema)
export const Crush = mongoose.models.Crush || mongoose.model<ICrush>("Crush", CrushSchema)
export const AnalysisRecord = mongoose.models.AnalysisRecord || mongoose.model<IAnalysisRecord>("AnalysisRecord", AnalysisRecordSchema)
export const ChatHistory = mongoose.models.ChatHistory || mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema)
export const SoulPartner = mongoose.models.SoulPartner || mongoose.model("SoulPartner", SoulPartnerSchema)
export const GraveComment = mongoose.models.GraveComment || mongoose.model("GraveComment", GraveCommentSchema)
export const SsumBung = mongoose.models.SsumBung || mongoose.model("SsumBung", SsumBungSchema)
