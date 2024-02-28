import { Field, SmartContract, state, State, method, Struct, Poseidon, Bool, Provable, UInt32, UInt64 } from 'o1js';
import { Gadgets } from 'o1js/dist/node/lib/gadgets/gadgets';

function and(val1: Bool, val2: Bool): Bool {
  return Gadgets.and(val1.toField(), val2.toField(), 32).equals(1);
}

function and3(val1: Bool, val2: Bool, val3: Bool): Bool {
  return and(and(val1, val2), val3);
}

export class Message extends Struct({
  messageNumber: Field,
  agentId: UInt32,
  agentXLocation: UInt32,
  agentYLocation: UInt32,
  checksum: UInt32
}) {
  constructor(value: {
    messageNumber: Field,
    agentId: UInt32,
    agentXLocation: UInt32,
    agentYLocation: UInt32,
    checksum: UInt32
  }) {
    super(value);
  }

  verifyAgentId(subExecution: Bool): Bool {
    // If Agent ID is zero we don't need to check the other values, but this is still a valid message
    return Provable.if(this.agentId.equals(UInt32.zero),
      Bool(true),
      // Agent ID (should be between 0 and 3000)
      Provable.if(this.agentId.lessThanOrEqual(new UInt32(3000)), subExecution, Bool(false)));
  }

  verifyAgentXLocation(subExecution: Bool): Bool {
    return Provable.if(
      // Agent XLocation (should be between 0 and 15000) 
      this.agentXLocation.lessThanOrEqual(new UInt32(15000)),
      subExecution,
      Bool(false));
  }

  verifyAgentYLocation(subExecution: Bool): Bool {
    // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
    return Provable.if(
      and3(this.agentYLocation.greaterThan(this.agentXLocation), this.agentYLocation.greaterThanOrEqual(new UInt32(5000)), this.agentYLocation.lessThanOrEqual(new UInt32(20000))),
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
      const emptyMessage = new Message({ messageNumber: Field.empty(), agentId: UInt32.zero, agentXLocation: UInt32.zero, agentYLocation: UInt32.zero, checksum: UInt32.zero });
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


