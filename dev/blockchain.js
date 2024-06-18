const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid').v1;

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [{
        "amount": 1000,
        "sender": "kadir",
        "recipient": "kadir",
        "privateKey": "kadir"
    }];
    this.pendingSocit = [];
    this.pendingComment = [];
    this.pendingLikes = [];
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

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        socits: this.pendingSocit,
        comments: this.pendingComment,
        likes: this.pendingLikes,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };
    this.pendingTransactions = [];
    this.pendingSocit = [];
    this.pendingComment = [];
    this.pendingLikes = [];
    this.chain.push(newBlock);

    return newBlock;
}

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);
        return hash;
    }
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };
    return newTransaction;
};

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
Blockchain.prototype.addSocitToPendingSocit = function(socitObj) {
    this.pendingSocit.push(socitObj);
    return this.getLastBlock()['index'] + 1;
}
//yeni yorumu oluşturma işlemi
Blockchain.prototype.createNewComment = function(message, sender, socitId) {
        const newComment = {
            message: message,
            sender: sender,
            socitId: socitId,
            commentId: uuid().split('-').join('')
        };
        return newComment;
    }
Blockchain.prototype.addCommentToPendingComment = function(commentObj) {
        this.pendingComment.push(commentObj);
        return this.getLastBlock()['index'] + 1;
    }
Blockchain.prototype.createNewLike = function(sender, socitId) {
    const newLike = {
        sender: sender,
        socitId: socitId
    };
    return newLike;
}
Blockchain.prototype.addLikeToPendingLike = function(likeObj) {
    this.pendingLikes.push(likeObj);
    return this.getLastBlock()['index'] + 1
}

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

    if (!correctNonce || !correctPreviousBlockHash || !correctHash)
        validChain = false;
    return validChain;
}

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
};
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
        socitData: socitData
    }
};
Blockchain.prototype.getSocitId = function(socitId) {
    let socitData;
    const commentData = [];
    let totalLike = 0;
    this.chain.forEach(block => {
        block.socits.forEach(socit => {
            if (socit.socitId == socitId) {
                socitData = socit;
            }
        });
    });
    this.chain.forEach(block => {
        block.comments.forEach(comment => {
            if (comment.socitId == socitId) {
                commentData.push(comment);
            }
        })
    })
    this.chain.forEach(block => {
        block.likes.forEach(like => {
            if (like.socitId == socitId) {
                totalLike++;
            }
        })
    })
    return {
        socitData: socitData,
        commentData: commentData,
        totalLike: totalLike
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
