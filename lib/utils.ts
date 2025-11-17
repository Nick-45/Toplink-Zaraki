import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateGrade(marks: number): string {
  if (marks >= 80) return 'A';
  if (marks >= 75) return 'A-';
  if (marks >= 70) return 'B+';
  if (marks >= 65) return 'B';
  if (marks >= 60) return 'B-';
  if (marks >= 55) return 'C+';
  if (marks >= 50) return 'C';
  if (marks >= 45) return 'C-';
  if (marks >= 40) return 'D+';
  if (marks >= 35) return 'D';
  if (marks >= 30) return 'D-';
  return 'E';
}

export function calculateGradePoints(marks: number): number {
  if (marks >= 80) return 12;
  if (marks >= 75) return 11;
  if (marks >= 70) return 10;
  if (marks >= 65) return 9;
  if (marks >= 60) return 8;
  if (marks >= 55) return 7;
  if (marks >= 50) return 6;
  if (marks >= 45) return 5;
  if (marks >= 40) return 4;
  if (marks >= 35) return 3;
  if (marks >= 30) return 2;
  return 1;
}

export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'High':
      return 'text-red-600 bg-red-100';
    case 'Medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'Low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
