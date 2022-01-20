const express = require('express');
const app = express();
const Blockchain = require('./blockchain');
const socialchain = new Blockchain();
const uuid = require('uuid').v1;
const port = process.argv[2];
const rp = require('request-promise');
const nodeAdress = uuid().split('-').join('');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/blockchain', function(req, res) {
    res.send(socialchain);
});


app.post('/transaction', function(req, res) {
    const newTransaction = req.body;
    const blockIndex = socialchain.addTransactionToPendingTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

app.post('/transaction/broadcast', function(req, res) {
    const user = socialchain.userWallet;
    let saved = false;
    for (let i = 0; i < user.length; i++) {
        if (user[i].username === req.body.sender && user[i].privateKey === req.body.privateKey) {
            saved = true;
            transationSaved();
            break;
        } else
            saved = false;
    }
    if (saved == false) {
        transationNotSave();
    }

    function transationSaved() {
        let balance = socialchain.getAddressData(req.body.sender).addressBalance;
        console.log(balance);
        const requestPromises = [];
        if (balance > req.body.amount) {
            const newTransaction = socialchain.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
            socialchain.addTransactionToPendingTransactions(newTransaction);
            socialchain.networkNodes.forEach(networkNodeUrl => {
                const requestOptions = {
                    uri: networkNodeUrl + '/transaction',
                    method: 'POST',
                    body: newTransaction,
                    json: true
                };
                requestPromises.push(rp(requestOptions));
            });
            Promise.all(requestPromises)
                .then(data => {
                    res.json({ note: 'Transaction created and broadcast successfully.' });
                });
        } else {
            Promise.all(requestPromises)
                .then(data => {
                    res.json({ note: 'Balance is missing.' });
                });
        }
    }

    function transationNotSave() {
        res.json({ note: 'Transaction not created' });
    }
});
app.post('/socit', function(req, res) {
    const newSocit = req.body;
    const blockIndex = socialchain.addSocitToPendingSocit(newSocit);
    res.json({ note: `Socit will be added in block ${blockIndex}.` });
});

app.post('/socit/broadcast', function(req, res) {
    const user = socialchain.userWallet;
    let saved = false;
    for (let i = 0; i < user.length; i++) {
        if (user[i].username === req.body.sender && user[i].privateKey === req.body.privateKey) {
            saved = true;
            socitSaved();
            break;
        } else
            saved = false;
    }
    if (saved == false) {
        socitNotSave();
    }

    function socitSaved() {
        const newSocit = socialchain.createNewSocit(req.body.message, req.body.sender);
        socialchain.addSocitToPendingSocit(newSocit);
        const requestPromises = [];
        socialchain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + '/socit',
                method: 'POST',
                body: newSocit,
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
        Promise.all(requestPromises)
            .then(data => {
                res.json({ note: 'Socit created and broadcast successfully.' });
            });
    }

    function socitNotSave() {
        res.json({ note: 'Socit not saved' });
    }
});
app.post('/like', function(req, res) {
    const newLike = req.body;
    const blockIndex = socialchain.addLikeToPendingLike(newLike);
    res.json({ note: `Socit will be added in block ${blockIndex}.` });
});


app.post('/like/broadcast', function(req, res) {
    const user = socialchain.userWallet;
    let saved = false;
    for (let i = 0; i < user.length; i++) {
        if (user[i].username === req.body.sender && user[i].privateKey === req.body.privateKey) {
            socialchain.chain.forEach(block => {
                block.socits.forEach(socit => {
                    if (socit.socitId == req.body.socitId) {
                        saved = true;
                        likeSaved();
                    }
                })
            });
        } else
            saved = false;
    }
    if (saved == false) {
        likeNotSave();
    }

    function likeSaved() {
        const newLike = socialchain.createNewLike(req.body.sender, req.body.socitId);
        socialchain.addLikeToPendingLike(newLike);
        const requestPromises = [];
        socialchain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + '/like',
                method: 'POST',
                body: newLike,
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
        Promise.all(requestPromises)
            .then(data => {
                res.json({ note: 'Like sending and broadcast successfully.' });
            });
    }

    function likeNotSave() {
        res.json({ note: 'Like not saved' });
    }
});







app.post('/comment', function(req, res) {
    const newComment = req.body;
    const blockIndex = socialchain.addCommentToPendingComment(newComment);
    res.json({ note: `Comment will be added in block ${blockIndex}.` });
});

app.post('/comment/broadcast', function(req, res) {
    const user = socialchain.userWallet;
    let saved = false;
    for (let i = 0; i < user.length; i++) {
        if (user[i].username === req.body.sender && user[i].privateKey === req.body.privateKey) {
            socialchain.chain.forEach(block => {
                block.socits.forEach(socit => {
                    if (socit.socitId == req.body.socitId) {
                        saved = true;
                        commentSaved();
                    }
                });
            });
            break;
        } else
            saved = false;
    }
    if (saved == false) {
        commentNotSave();
    }

    function commentSaved() {
        const newComment = socialchain.createNewComment(req.body.message, req.body.sender, req.body.socitId);
        socialchain.addCommentToPendingComment(newComment);
        const requestPromises = [];
        socialchain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + '/comment',
                method: 'POST',
                body: newComment,
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
        Promise.all(requestPromises)
            .then(data => {
                res.json({ note: 'Comment created and broadcast successfully.' });
            });
    }

    function commentNotSave() {
        res.json({ note: 'Comment not saved' });
    }
});








app.get('/mine', function(req, res) {
    mining();

    //setInterval(mining,5000);
    function mining() {
        const lastBlock = socialchain.getLastBlock();
        const previousBlockHash = lastBlock['hash'];
        const currentBlockData = {
            transactions: socialchain.pendingTransactions,
            index: lastBlock['index'] + 1
        };
        const nonce = socialchain.proofOfWork(previousBlockHash, currentBlockData);
        const blockHash = socialchain.hashBlock(previousBlockHash, currentBlockData, nonce);
        const newBlock = socialchain.createNewBlock(nonce, previousBlockHash, blockHash);

        const requestPromises = [];
        socialchain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + '/receive-new-block',
                method: 'POST',
                body: { newBlock: newBlock },
                json: true
            };

            requestPromises.push(rp(requestOptions));
        });

        Promise.all(requestPromises)
            .then(data => {
                const requestOptions = {
                    uri: socialchain.currentNodeUrl + '/transaction/broadcast',
                    method: 'POST',
                    body: {
                        amount: 12.5,
                        sender: "00",
                        recipient: nodeAdress
                    },
                    json: true
                };

                return rp(requestOptions);
            })
            .then(data => {
                res.json({
                    note: "New block mined & broadcast successfully",
                    block: newBlock
                });
            });
    }
});

app.get('/', function(req, res) {
    res.send('');
});

app.post('/receive-new-block', function(req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = socialchain.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex) {
        socialchain.chain.push(newBlock);
        socialchain.pendingTransactions = [];
        res.json({
            note: 'New block received and accepted.',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New block rejected.',
            newBlock: newBlock
        });
    }
});

// REGİSTER NODE 
app.post('/register-and-broadcast-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (socialchain.networkNodes.indexOf(newNodeUrl) == -1) socialchain.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    socialchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        };

        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...socialchain.networkNodes, socialchain.currentNodeUrl] },
                json: true
            };

            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: 'New node registered with network successfully.' });
        });
});


app.post('/register-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = socialchain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = socialchain.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) socialchain.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully.' });
});


app.post('/register-nodes-bulk', function(req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = socialchain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = socialchain.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) socialchain.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: 'Bulk registration successful.' });
});

app.get('/consensus', function(req, res) {
    const requestPromises = [];
    socialchain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
        .then(blockchains => {
            const currentChainLengt = socialchain.chain.length;
            let maxChainLengt = currentChainLengt;
            let newLongestChain = null;
            let newPendingTransactions = null;
            let newPengingSocit = null;

            blockchains.forEach(blockchain => {
                if (blockchain.chain.length > maxChainLengt) {
                    maxChainLengt = blockchain.chain.length;
                    newLongestChain = blockchain.chain;
                    newPendingTransactions = blockchain.pendingTransactions;
                    newPengingSocit = blockchain.pendingSocit;
                }
            });
            if (!newLongestChain || (newLongestChain && !socialchain.chainIsValid(newLongestChain))) {
                res.json({
                    note: 'Current chain has not been replaced',
                    chain: socialchain.chain
                });
            } else if (newLongestChain && socialchain.chainIsValid(newLongestChain)) {
                socialchain.chain = newLongestChain;
                socialchain.pendingTransactions = newPendingTransactions;
                socialchain.pendingSocit = newPengingSocit;

                res.json({
                    note: 'This chain has been replaced',
                    chain: socialchain.chain,
                });
            }
        });
});


/////////////////////////////////////////////////WALLET//////////////////////////////////////////

app.post('/wallet', function(req, res) {
    let username = req.body.username;
    const message = socialchain.createNewWallet(username);
    res.json({
        note: message
    });

});




/////////////////////////////////////////////////EXPLORER//////////////////////////////////////////
app.get('/block/:blockHash', function(req, res) {
    const blockHash = req.params.blockHash;
    const correctBlock = socialchain.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

app.get('/transaction/:transactionId', function(req, res) {
    const transactionId = req.params.transactionId;
    const trasactionData = socialchain.getTransaction(transactionId);
    res.json({
        transaction: trasactionData.transaction,
        block: trasactionData.block
    });
});

app.get('/transactions/:address', function(req, res) {
    const address = req.params.address;
    const addressData = socialchain.getAddressData(address);
    res.json({
        addressData: addressData.addressTransactions
    });
});
app.get('/socits/:address', function(req, res) {
    const address = req.params.address;
    const socitData = socialchain.getSocitData(address);
    res.json({
        socitData: socitData
    });
});
app.get('/socit/:socitId', function(req, res) {
    const socitId = req.params.socitId;
    const data = socialchain.getSocitId(socitId);
    res.json({
        socit: data,
    });
});
app.get('/balance/:address', function(req, res) {
    const address = req.params.address;
    const addressData = socialchain.getAddressData(address);
    res.json({
        addressData: addressData.addressBalance
    });
});




app.listen(port, function() {
    console.log(`Listening on port ${port}.`);
});