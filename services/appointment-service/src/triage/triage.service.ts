import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { KafkaService } from '../common/kafka/kafka.service';
import { CreateTriageDto } from './dto';
import { TriageRequest, UrgencyLevel, TriageStatus } from '@prisma/client';

@Injectable()
export class TriageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(createTriageDto: CreateTriageDto): Promise<TriageRequest> {
    const triage = await this.prisma.triageRequest.create({
      data: {
        ...createTriageDto,
        status: TriageStatus.PENDING,
      },
    });

    // Publish event to Kafka for AI processing
    await this.kafkaService.publishTriageRequested(triage);

    return triage;
  }

  async findAll(): Promise<TriageRequest[]> {
    return this.prisma.triageRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<TriageRequest | null> {
    return this.prisma.triageRequest.findUnique({
      where: { id },
    });
  }

  async findByPatient(patientId: string): Promise<TriageRequest[]> {
    return this.prisma.triageRequest.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTriageResult(
    id: string,
    predictedSpecialty: string,
    urgency: UrgencyLevel,
  ): Promise<TriageRequest> {
    const triage = await this.prisma.triageRequest.update({
      where: { id },
      data: {
        predictedSpecialty,
        urgency,
        status: TriageStatus.COMPLETED,
      },
    });

    // Publish event to Kafka
    await this.kafkaService.publishEvent('triage.completed', {
      id: triage.id,
      patientId: triage.patientId,
      predictedSpecialty: triage.predictedSpecialty,
      urgency: triage.urgency,
      completedAt: triage.updatedAt,
    });

    return triage;
  }

  async predictSpecialty(symptoms: string): Promise<{ specialty: string; urgency: UrgencyLevel }> {
    // This is a simplified AI prediction
    // In a real app, you'd integrate with an AI/ML service
    const specialtyKeywords = {
      'cardiology': ['chest pain', 'heart', 'cardiac', 'blood pressure', 'chest tightness'],
      'neurology': ['headache', 'dizzy', 'seizure', 'numbness', 'weakness', 'memory'],
      'orthopedics': ['bone', 'joint', 'fracture', 'sprain', 'back pain', 'knee', 'shoulder'],
      'dermatology': ['skin', 'rash', 'mole', 'acne', 'itchy', 'redness'],
      'pediatrics': ['child', 'baby', 'infant', 'fever', 'vaccination'],
      'psychiatry': ['anxiety', 'depression', 'mood', 'mental', 'panic', 'stress'],
      'gastroenterology': ['stomach', 'nausea', 'vomit', 'diarrhea', 'abdominal', 'digestive'],
      'pulmonology': ['cough', 'breathing', 'lung', 'asthma', 'chest', 'respiratory'],
    };

    const urgencyKeywords = {
      'URGENT': ['severe', 'emergency', 'critical', 'unconscious', 'bleeding', 'chest pain'],
      'HIGH': ['pain', 'fever', 'difficulty', 'swelling', 'injury'],
      'MEDIUM': ['mild', 'discomfort', 'ache', 'sore'],
      'LOW': ['check', 'routine', 'preventive', 'follow-up'],
    };

    const symptomsLower = symptoms.toLowerCase();
    
    // Find matching specialty
    let predictedSpecialty = 'general';
    let maxMatches = 0;
    
    for (const [specialty, keywords] of Object.entries(specialtyKeywords)) {
      const matches = keywords.filter(keyword => symptomsLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        predictedSpecialty = specialty;
      }
    }

    // Determine urgency
    let urgency = UrgencyLevel.LOW;
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => symptomsLower.includes(keyword))) {
        urgency = level as UrgencyLevel;
        break;
      }
    }

    return { specialty: predictedSpecialty, urgency };
  }
}
