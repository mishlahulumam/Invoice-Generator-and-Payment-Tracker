import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Hapus', danger = true }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-4">
          {danger && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm px-3 py-1.5">Batal</button>
          <button
            onClick={onConfirm}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
