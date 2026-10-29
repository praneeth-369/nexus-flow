import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
      default: 'nexusflow-cloud-v2',
    },
    name: {
      type: String,
      required: true,
      default: 'Cloud Platform v2.0 Launch',
    },
    description: {
      type: String,
      default: 'Enterprise multi-tenant cloud platform overhaul with distributed dependency orchestration.',
    },
    targetDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'active',
    },
    taskPrefix: {
      type: String,
      default: 'NX',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
