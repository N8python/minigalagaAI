let contenstants = Array(100).fill(() => NN({
    inputs: 10,
    hiddenLayers: [8, 8],
    outputs: 3
})).map(x => x());

let highscore = 0;
let fitnessSum;
let generation = 1;

function chooseParent(parents) {
    let threshold = Math.random() * fitnessSum;
    let sum = 0;
    return parents.find(p => {
        sum += p.fitness;
        if (sum > threshold) {
            console.log(p.fitness);
            return true;
        }
    }) || parents[0];
}

function gen() {
    const scores = [];
    fitnessSum = 0;
    contenstants.forEach(c => {
        reset();
        let framesLeft = 2000;
        let penalty = 1;
        let good = 1;
        let oldXvel = ship.xVel;
        let oldX = ship.x;
        let rewardNotAchieved = false;
        while (framesLeft > 0) {
            if (score > highscore) {
                highscore = score;
            }
            step();
            if (frame % 100 === 0) {
                if (oldXvel === ship.xVel) {
                    penalty *= 1.5;
                } else if (firing && !(ship.x === oldX) && !(ship.xVel === oldXvel)) {
                    good *= 2;
                    health += 5 * (frame / 100)
                }
                if (ship.x < 20 || ship.x > 500 || ship.x === 240) {
                    penalty *= 3;
                }
                if (ship.x === oldX) {
                    penalty *= 10;
                }
                oldXvel = ship.xVel;
                oldX = ship.x;
            }
            const choice = doAction(c.feedForward(ship.prepareInputs()));
            if (gameState === "over") {
                scores.push(score);
                break;
            }
            framesLeft -= 1;
        }
        c.fitness = Math.max(2 ** score - penalty + good, 1);
        fitnessSum += c.fitness;
    })
    reset();
    // contenstants = contenstants.sort((a, b) => a.fitness - b.fitness);
    let champion = contenstants.reduce((c, t) => {
        if (c.fitness > t.fitness) {
            return c;
        } else {
            return t;
        }
    }, contenstants[0]);
    const mutCo = 0.05;
    const old = contenstants;
    contenstants = contenstants.map(c => c === champion ? c : chooseParent(old).reproduceWith(chooseParent(old)).reproduce(mutCo))
    generation += 1;
    return champion;
}