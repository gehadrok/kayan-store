import crypto from 'crypto';
import type { AIJob, AIJobStatus } from '../../../types.ts';

export class AIJobQueue {
  private jobs: Map<string, AIJob> = new Map();

  public createJob(params: Omit<AIJob, 'id' | 'status' | 'createdAt' | 'updatedAt'>): AIJob {
    const id = 'ai_job_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const job: AIJob = {
      ...params,
      id,
      status: 'queued',
      createdAt: now,
      updatedAt: now
    };
    this.jobs.set(id, job);
    return job;
  }

  public getJob(id: string): AIJob | undefined {
    return this.jobs.get(id);
  }

  public updateJobStatus(id: string, status: AIJobStatus, result?: Record<string, any>, error?: string): AIJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    job.status = status;
    if (result) job.result = result;
    if (error) job.error = error;
    job.updatedAt = new Date().toISOString();

    this.jobs.set(id, job);
    return job;
  }

  public listJobsByProject(projectId: string): AIJob[] {
    return Array.from(this.jobs.values()).filter(j => j.projectId === projectId);
  }

  public listJobsByUser(userId: string): AIJob[] {
    return Array.from(this.jobs.values()).filter(j => j.userId === userId);
  }
}
