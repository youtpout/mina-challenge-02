import { MessageAnalyzer, Message, Message200 } from './MessageAnalyzer';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, UInt32 } from 'o1js';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('MessageAnalyzer', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: MessageAnalyzer;

  beforeAll(async () => {
    if (proofsEnabled) await MessageAnalyzer.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new MessageAnalyzer(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `Add` smart contract', async () => {
    await localDeploy();
    const num = zkApp.maxMessageNumber.get();
    expect(num).toEqual(Field(0));
  });

  it('correctly test messages 100', async () => {
    await localDeploy();

    const messages: Message[] = [];
    for (let index = 0; index < 100; index++) {
      let message = new Message({ messageNumber: new Field(index), agentId: new UInt32(1500), agentXLocation: new UInt32(15000), agentYLocation: new UInt32(20000), checksum: new UInt32(36500) });
      //message.checksum = message.agentId.add(message.agentXLocation).add(message.agentYLocation);

      messages.push(message);
    }

    const msg200 = new Message200({ messages });

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      //zkApp.update();
      zkApp.analyze(msg200);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.maxMessageNumber.get();
    expect(updatedNum).toEqual(Field(99));
  });

  it('correctly test messages 200', async () => {
    await localDeploy();

    const messages: Message[] = [];
    for (let index = 0; index < 200; index++) {
      let message = new Message({ messageNumber: new Field(index), agentId: new UInt32(1500), agentXLocation: new UInt32(15000), agentYLocation: new UInt32(20000), checksum: new UInt32(36500) });
      //message.checksum = message.agentId.add(message.agentXLocation).add(message.agentYLocation);

      messages.push(message);
    }

    const msg200 = new Message200({ messages });

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      //zkApp.update();
      zkApp.analyze(msg200);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.maxMessageNumber.get();
    expect(updatedNum).toEqual(Field(199));
  });


  it('correctly test messages unordered', async () => {
    await localDeploy();

    const messages: Message[] = [];

    let message = new Message({ messageNumber: new Field(10), agentId: new UInt32(1500), agentXLocation: new UInt32(15000), agentYLocation: new UInt32(20000), checksum: new UInt32(36500) });
    messages.push(message);

    // biggest messageNumber
    message = new Message({ messageNumber: new Field(32), agentId: new UInt32(0), agentXLocation: new UInt32(0), agentYLocation: new UInt32(20000), checksum: new UInt32(36500) });
    messages.push(message);

    // incorrect
    message = new Message({ messageNumber: new Field(55), agentId: new UInt32(2), agentXLocation: new UInt32(0), agentYLocation: new UInt32(20000), checksum: new UInt32(36500) });
    messages.push(message);

    message = new Message({ messageNumber: new Field(12), agentId: new UInt32(0), agentXLocation: new UInt32(0), agentYLocation: new UInt32(20000), checksum: new UInt32(36500) });
    messages.push(message);


    const msg200 = new Message200({ messages });

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      //zkApp.update();
      zkApp.analyze(msg200);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.maxMessageNumber.get();
    expect(updatedNum).toEqual(Field(32));
  });



  it('only incorrect message', async () => {
    await localDeploy();

    const messages: Message[] = [];

    // invalid checksum
    let message = new Message({ messageNumber: new Field(10), agentId: new UInt32(1500), agentXLocation: new UInt32(15000), agentYLocation: new UInt32(20000), checksum: new UInt32(50000) });
    messages.push(message);

    // Y bigger than X
    message = new Message({ messageNumber: new Field(32), agentId: new UInt32(10), agentXLocation: new UInt32(10000), agentYLocation: new UInt32(8000), checksum: new UInt32(18010) });
    messages.push(message);

    // agent id > 3000
    message = new Message({ messageNumber: new Field(55), agentId: new UInt32(5000), agentXLocation: new UInt32(0), agentYLocation: new UInt32(20000), checksum: new UInt32(25000) });
    messages.push(message);

    // agent X > 15001
    message = new Message({ messageNumber: new Field(12), agentId: new UInt32(1), agentXLocation: new UInt32(15001), agentYLocation: new UInt32(20000), checksum: new UInt32(35002) });
    messages.push(message);

    // agent Y > 20000
    message = new Message({ messageNumber: new Field(12), agentId: new UInt32(1), agentXLocation: new UInt32(5000), agentYLocation: new UInt32(20001), checksum: new UInt32(25002) });
    messages.push(message);

    // agent Y < 5000
    message = new Message({ messageNumber: new Field(12), agentId: new UInt32(1), agentXLocation: new UInt32(0), agentYLocation: new UInt32(4000), checksum: new UInt32(4001) });
    messages.push(message);


    const msg200 = new Message200({ messages });

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      //zkApp.update();
      zkApp.analyze(msg200);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.maxMessageNumber.get();
    expect(updatedNum).toEqual(Field(0));
  });


});
