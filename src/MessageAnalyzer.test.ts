import { MessageAnalyzer, Message, Message200 } from './MessageAnalyzer';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'o1js';

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

  it('correctly test messages', async () => {
    await localDeploy();

    const messages: Message[] = [];
    for (let index = 0; index < 100; index++) {
      let message = new Message({ messageNumber: new Field(index), agentId: new Field(1500), agentXLocation: new Field(15000), agentYLocation: new Field(20000), checksum: new Field(36500) });
      //message.checksum = message.agentId.add(message.agentXLocation).add(message.agentYLocation);

      messages.push(message);
    }

    const msg100 = new Message200({ messages });

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      //zkApp.update();
      zkApp.analyze(msg100);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.maxMessageNumber.get();
    expect(updatedNum).toEqual(Field(99));
  });

  function randomField(maxValue: number): Field {
    const nb = Math.random() * maxValue;
    return Field(Math.floor(nb));
  }
});
