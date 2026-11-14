import { describe, expect, it } from 'vitest';
import { generatePrepBuzzwords } from './prep-buzzwords';

const mockJob = {
  title: 'Backend Software Engineer',
  company: 'CloudStream Systems',
  description: 'Building microservices in Go with Kafka message queues and Kubernetes container orchestration.',
};

describe('generatePrepBuzzwords', () => {
  it('successfully extracts buzzwords with definitions and unverified labels', async () => {
    const mockOutput = JSON.stringify({
      buzzwords: [
        {
          term: 'Kafka',
          definition: 'A distributed event streaming platform used for high-throughput data pipelines.',
          contextInJob: 'Used for message queue architecture in microservices.',
        },
        {
          term: 'Kubernetes',
          definition: 'An open-source container orchestration system for automating deployment and scaling.',
          contextInJob: 'Mentioned for container management.',
        },
      ],
    });

    const result = await generatePrepBuzzwords({
      job: mockJob,
      modelCaller: async () => ({ ok: true, content: mockOutput }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.buzzwords).toHaveLength(2);
    expect(result.buzzwords[0].term).toBe('Kafka');
    expect(result.buzzwords[0].verified).toBe(false);
    expect(result.buzzwords[1].term).toBe('Kubernetes');
    expect(result.buzzwords[1].verified).toBe(false);
  });

  it('rejects oversized descriptions', async () => {
    const result = await generatePrepBuzzwords({
      job: { ...mockJob, description: 'A'.repeat(20_001) },
      modelCaller: async () => ({ ok: true, content: '{}' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('handles model error gracefully', async () => {
    const result = await generatePrepBuzzwords({
      job: mockJob,
      modelCaller: async () => ({ ok: false, error: 'Connection refused' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('MODEL_ERROR');
    expect(result.error).toBe('Connection refused');
  });
});
