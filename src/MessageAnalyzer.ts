import { Field, SmartContract, state, State, method, Struct, Poseidon, Bool, Provable } from 'o1js';


export class Message extends Struct({
  messageNumber: Field,
  agentId: Field,
  agentXLocation: Field,
  agentYLocation: Field,
  checksum: Field
}) {
  constructor(value: {
    messageNumber: Field,
    agentId: Field,
    agentXLocation: Field,
    agentYLocation: Field,
    checksum: Field
  }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.messageNumber,
      this.agentId,
      this.agentXLocation,
      this.agentYLocation,
      this.checksum,
    ]);
  }
}


export class Message50 extends Struct({
  messages: [
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message
  ]
}) { }

export class Message100 extends Struct({
  messages: [
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message
  ]
}) { }

export class Message150 extends Struct({
  messages: [
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message
  ]
}) { }

export class Message200 extends Struct({
  messages: [
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message
  ]
}) { }

export class MessageAnalyzer extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  init() {
    super.init();
  }

  @method analyze(msg: Message100) {
    let lastId = this.maxMessageNumber.getAndRequireEquals();
    for (let index = 0; index < msg.messages.length; index++) {
      const element = msg.messages[index];
      lastId = Provable.if(CheckMessage(lastId, element), element.messageNumber, lastId);
    }
    this.maxMessageNumber.set(lastId);
  }
}



export function CheckMessage(lastId: Field, messages: Message): Bool {
  const zero = Field(0);
  // In case the message number is not greater than the previous one, this means that this is a duplicate message
  if (messages.messageNumber.lessThanOrEqual(lastId)) {
    return Bool(false);
  }
  // If Agent ID is zero we don't need to check the other values, but this is still a valid message
  if (messages.agentId == zero) {
    return Bool(true);
  }

  // Agent ID (should be between 0 and 3000)
  if (messages.agentId > zero && messages.agentId <= Field(3000)) {
    //Agent XLocation (should be between 0 and 15000) Agent YLocation
    if (messages.agentXLocation >= zero && messages.agentXLocation <= Field(15000)) {
      // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
      if (messages.agentYLocation > messages.agentXLocation && messages.agentYLocation >= Field(5000) && messages.agentYLocation <= Field(20000)) {
        // CheckSum is the sum of Agent ID , Agent XLocation,and Agent YLocation
        const sum = messages.agentId.add(messages.agentXLocation).add(messages.agentYLocation);
        return Bool(sum == messages.checksum);
      }
    }
  }
  return Bool(false);
}
