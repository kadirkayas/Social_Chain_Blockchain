const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid').v1;

//Blockchain nesnesi
function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [{
        "amount": 1000,
        "sender": "kadir",
        "recipient": "kadir",
        "privateKey": "kadir"
    }];
    this.pendingSocit = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    this.userWallet = [{
            username: "kadir",
            privateKey: "kadir"
        },
        {
            username: "deneme",
            privateKey: "deneme"
        }
    ];


    this.createNewBlock(100, '0', '0');
}

//yeni block ekleme fonksiyonu
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    // yeni bloğun içerisindeki dataları sakladığımız alan
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        socits: this.pendingSocit,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };
    //bekleyen işlemleri temizleyip yeni bloğu ağa ekleme kısmı
    this.pendingTransactions = [];
    this.pendingSocit = [];
    this.chain.push(newBlock);

    return newBlock;
}

//son bloğun indexini getirme fonksionu
Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
};

//yeni gönderim işlemi oluşturma fonksiyonu
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };
    return newTransaction;
};

//yeni gönderimi pendinge alma fonklsiyonu
Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
};
//yeni socit işlemi oluşturma fonksiyonu
Blockchain.prototype.createNewSocit = function(message, sender) {
    const newSocit = {
        message: message,
        sender: sender,
        socitId: uuid().split('-').join('')
    };
    return newSocit;
};
//yeni sociti pendinge alma fonklsiyonu
Blockchain.prototype.addSocitToPendingSocit = function(socitObj) {
    this.pendingSocit.push(socitObj);
    return this.getLastBlock()['index'] + 1;
};

//hashleme fonksiyonu
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);
        return hash;
    }
    //pow yani nonce değeri hesaplandığı yer
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

//zincirin doğruluğunun kanıtlandığı yer 
Blockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;
    for (var i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlok = blockchain[i - 1];
        const blockHash = this.hashBlock(prevBlok['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
        if (blockHash.substring(0, 4) !== '0000') validChain = false;
        if (currentBlock['previousBlockHash'] !== prevBlok['hash']) validChain = false;

        console.log('previousBlockHash=>', prevBlok['hash']);
        console.log('currentBlockHash=>', currentBlock['hash']);
    }
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions)
        validChain = false;
    return validChain;
}

// blok detaylarının hash ile sorgulandığı yer
Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
};
//gönderimlerin transacitonid ile sorgulandığı yer
Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            };
        });
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};
//adress işlemlerinin ve net bakiyenin sorgulandığı yer
Blockchain.prototype.getAddressData = function(address) {
    const addressTransactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.sender === address || transaction.recipient === address) {
                addressTransactions.push(transaction);
            };
        });
    });

    let balance = 0;
    addressTransactions.forEach(transaction => {
        if (transaction.recipient === address) balance += transaction.amount;
        else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance: balance,
        addressSocit: this.getSocitData(address)
    };
};


Blockchain.prototype.getSocitData = function(address) {
    const socitData = [];
    this.chain.forEach(block => {
        block.socits.forEach(socit => {
            if (socit.sender == address) {
                socitData.push(socit);
            }
        });
    });
    return {
        socitData: socitData,
    }
};

Blockchain.prototype.createNewWallet = function(username) {
    let message = "";
    let registered = false;
    this.userWallet.forEach(user => {
        if (user.username === username) {
            registered = true;
            message = "User already registered";
        }
    });
    if (registered == false) {
        message = "User registered user private key  =>  " + this.userRegister(username).privateKey;
    }
    return message;
}
Blockchain.prototype.userRegister = function(username) {
    const privateKey = sha256(username + Date.now().toString());
    const wallet = {
        username: username,
        privateKey: privateKey
    };
    this.userWallet.push(wallet);
    return wallet;
}


module.exports = Blockchain;