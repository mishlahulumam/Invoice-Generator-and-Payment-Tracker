export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="text-center py-16">
      {Icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
