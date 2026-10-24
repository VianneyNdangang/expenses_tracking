import type { IDebtRecognition } from '../models/DebtRecognition'

export function serializeDebtRecognition(recognition: IDebtRecognition) {
  return {
    id: recognition._id,
    reference: recognition.reference,
    debtorName: recognition.debtorName,
    creditorName: recognition.creditorName,
    amount: recognition.amount,
    recognitionDate: recognition.recognitionDate,
    dueDate: recognition.dueDate || null,
    purpose: recognition.purpose,
    notes: recognition.notes,
    status: recognition.status,
    createdByName: recognition.createdByName,
    validatedByName: recognition.validatedByName || null,
    validatedAt: recognition.validatedAt || null,
    justifiedByName: recognition.justifiedByName || null,
    justifiedAt: recognition.justifiedAt || null,
    signedDocumentFilename: recognition.signedDocumentFilename || null,
    hasSignedDocument: Boolean(recognition.signedDocumentRef),
    justificationFilename: recognition.justificationFilename || null,
    hasJustificationDocument: Boolean(recognition.justificationRef),
    createdAt: recognition.createdAt,
    updatedAt: recognition.updatedAt
  }
}
