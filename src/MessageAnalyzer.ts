import { Field, SmartContract, state, State, method, Struct, Poseidon, Bool, Provable } from 'o1js';
import { Gadgets } from 'o1js/dist/node/lib/gadgets/gadgets';


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

  verifyAgentId(subExecution: Bool): Bool {
    // If Agent ID is zero we don't need to check the other values, but this is still a valid message
    return Provable.if(this.agentId.equals(0),
      Bool(true),
      subExecution);
  }

  verifyAgentXLocation(subExecution: Bool): Bool {
    return Provable.if(
      // Agent ID (should be between 0 and 3000)
      Gadgets.and(this.agentId.greaterThan(0).toField(), this.agentId.lessThanOrEqual(3000).toField(), 32)
        .equals(1),
      subExecution,
      Bool(false));
  }

  verifyAgentYLocation(subExecution: Bool): Bool {
    // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
    return Provable.if(
      // Agent ID (should be between 0 and 3000)
      Gadgets.and(Gadgets.and(this.agentYLocation.greaterThan(this.agentXLocation).toField(), this.agentYLocation.greaterThanOrEqual(5000).toField(), 32), this.agentYLocation.lessThanOrEqual(Field(20000)).toField(), 32)
        .equals(1),
      subExecution,
      Bool(false));
  }

  verifyChecksum(): Bool {
    // CheckSum is the sum of Agent ID , Agent XLocation,and Agent YLocation
    return Provable.if(
      this.agentId.add(this.agentXLocation).add(this.agentYLocation).equals(this.checksum),
      Bool(true),
      Bool(false));
  }

  isCorrect(): Bool {
    // chain verification
    return this.verifyAgentId(this.verifyAgentXLocation(this.verifyAgentYLocation(this.verifyChecksum())));
  }
}


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
}) {
  constructor(value: {
    messages: Message[]
  }) {
    let newMsg = value;
    if (value.messages.length > 200) {
      throw Error("More than 200 messages");
    }
    else if (value.messages.length < 200) {
      // we fill with empty message to get 200 messages
      const nb = 200 - value.messages.length;
      const emptyMessage = new Message({ messageNumber: Field.empty(), agentId: Field.empty(), agentXLocation: Field.empty(), agentYLocation: Field.empty(), checksum: Field.empty() });
      for (let index = 0; index < nb; index++) {
        value.messages.push(emptyMessage);
      }

    }
    super(newMsg);
  }
}

export class MessageAnalyzer extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  init() {
    super.init();
  }

  @method analyze(msg: Message200) {
    let lastId = this.maxMessageNumber.getAndRequireEquals();

    for (let index = 0; index < 200; index++) {
      const element = msg.messages[index];
      const isCorrect = element.isCorrect();
      // In case the message number is not greater than the previous one, this means that this is a duplicate message
      lastId = Provable.if(element.messageNumber.greaterThan(lastId),
        Provable.if(isCorrect, element.messageNumber, lastId), lastId);
    }
    // store the bigest id never evaluated
    this.maxMessageNumber.set(lastId);
  }
}


