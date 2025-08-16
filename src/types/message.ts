export type TMessage = {
  _id: string
  sender: string
  receiver: string
  content: string
  delivered: boolean
  createdAt: Date
}
