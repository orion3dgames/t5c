import nengi from 'nengi';

class Message {
  constructor(sourceId, type, message) {
    this.sourceId = sourceId
    this.type = type
    this.message = message
  }
}

Message.protocol = {
  sourceId: nengi.UInt16,
  type: nengi.UTF8String,
  message: nengi.UTF8String,
}

export default Message;