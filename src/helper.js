import { Algorithm } from './algo'

/*function shuffle(numbers) {
    for (var i = numbers.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = numbers[i];
        numbers[i] = numbers[j];
        numbers[j] = temp;
    }
    return numbers;
}*/

const shuffle = class extends Algorithm {
    static name = "Shuffle";

    * execute() {
        for (let i = this.count - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            this.swap(i, j);
            yield;
        }
    }
}

export default shuffle;