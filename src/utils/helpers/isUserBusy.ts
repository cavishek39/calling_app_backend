import Call from '../../models/Call'

// Helper: check if user is busy
export async function isUserBusy(userId: string) {
  const ongoing = await Call.findOne({
    $or: [
      { caller: userId, status: { $in: ['requested', 'accepted'] } },
      { receiver: userId, status: { $in: ['requested', 'accepted'] } },
    ],
  })
  return !!ongoing
}
