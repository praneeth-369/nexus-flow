import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    projectId: {
      type: String,
      required: true,
      default: 'nexusflow-cloud-v2',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      name: { type: String, default: 'Unassigned' },
      role: { type: String, default: 'Contributor' },
      avatar: { type: String, default: '' },
      initials: { type: String, default: 'UN' },
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Blocked', 'Ready', 'In Progress', 'Completed'],
      default: 'Ready',
    },
    dueDate: {
      type: String,
      required: true,
    },
    estimatedDays: {
      type: Number,
      default: 3,
      min: 1,
    },
    dependencies: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
