class Algorithm {
    constructor(swap, compare, clear, read, write, count) {
        this.swap = swap;
        this.compare = compare;
        this.clear = clear;
        this.read = read;
        this.write = write;
        this.count = count;
    }

    async merge(left, middle, right) {
        const merged = [];

        let i = left;
        let j = middle + 1;

        while (i <= middle && j <= right) {
            if (this.compare(i, j) < 0) {
                merged.push(this.read(i));
                i++;
            } else {
                merged.push(this.read(j));
                j++;
            }
            await this.clear();
        }
        while (i <= middle) {
            merged.push(this.read(i));
            i++;
            await this.clear();
        }
        while (j <= middle) {
            merged.push(this.read(i));
            j++;
            await this.clear();
        }
        i = 0;
        while (i < merged.length) {
            this.write(left + i, merged[i]);
            await this.clear();
            i++;
        }
    }
    async execute() { }
}

const algortithms = {
    //Swap unordered pairs and loop
    bubbleSort: class extends Algorithm {
        async execute() {
            let index = 0;
            let unorderedCount = this.count;

            while (unorderedCount > 0) {
                if (index + 1 >= unorderedCount) {
                    index = 0
                    unorderedCount--;
                }
                if (this.compare(index + 1, index) < 0)
                    this.swap(index + 1, index);

                index++;
                await this.clear();
            }
        }
    },
    //Bring the smallest bars to the right
    selectionSort: class extends Algorithm {
        async execute() {
            let index = 0;
            let firstUnorderedIndex = 0;
            let minIndex = 0;

            while (firstUnorderedIndex < this.count) {

                if (index >= this.count) {
                    this.swap(firstUnorderedIndex, minIndex);
                    firstUnorderedIndex++;
                    index = minIndex = firstUnorderedIndex;
                }
                if (this.compare(index, minIndex) < 0)
                    minIndex = index;
                index++;
                await this.clear();
            }
        }
    },
    //Bubble sort by adding numbers one by one
    insertionSort: class extends Algorithm {
        async execute() {
            let index = 1;
            let firstUnorderedIndex = 1;

            while (firstUnorderedIndex <= this.count) {
                if (index > 0 && this.compare(index, index - 1) < 0) {
                    this.swap(index, index - 1);
                    index--;
                } else
                    index = firstUnorderedIndex++;
                await this.clear();
            }
        }
    },
    mergeSort: class extends Algorithm {
        async execute() {
            let size = 1;
            let left = 0;

            while (size < this.count - 1) {
                if (left >= this.count - 1) {
                    size *= 2;
                    left = 0;
                }
                let mid = left + size - 1;
                let right = Math.min(left + 2 * size - 1, this.count - 1);

                await this.merge(left, mid, right);
                left += size * 2;
                await this.clear();
            }
        }
    },
    quickSort: class extends Algorithm {
        async partition(left, right) {
            let pivot = right;
            let i = left;
            let minIndex = left;

            while (i < right) {
                if (this.compare(i, pivot) < 0) {
                    this.swap(i, minIndex);
                    minIndex++;
                }
                i++;
                await this.clear();
            }
            this.swap(minIndex, pivot);
            await this.clear();
            return minIndex; //The current index of the pivot, as they were swaped.
        }
        async execute() {
            const stack = [0, this.count - 1];

            while (stack.length > 0) {
                let right = stack.pop();
                let left = stack.pop();
                let pivotIndex = await this.partition(left, right);

                if (right > pivotIndex + 1) { //If there are elements on the right side of the pivot.
                    stack.push(pivotIndex + 1);
                    stack.push(right);
                }
                if (left < pivotIndex - 1) { //If there are elements on the left side of the pivot
                    stack.push(left);
                    stack.push(pivotIndex - 1);
                }
            }
        }
    },
    countingSort: class extends Algorithm {
        async execute() {
            //Each bucket stores the frecuency of each number. As such, the number of needed
            //buckets equals the maximum number, which in this case is equal to the array length.
            //The memory needed to do counting sort increases linearly with the maximum number.
            //But there are alternatives:
            //- Radix sort: buckets store the frecuency of each digit.
            //- Bucket sort:
            //In depth explaining: https://stackoverflow.com/questions/14368392/radix-sort-vs-counting-sort-vs-bucket-sort-whats-the-difference
            let maximumNumber = this.count;
            const buckets = new Array(maximumNumber).fill(0);

            //Count the number of times each index appears
            for (let i = 0; i < maximumNumber; i++) {
                buckets[this.read(i) - 1]++;
                await this.clear();
            }

            for (let i = 0, outI = 0; i < maximumNumber; i++) {
                for (let j = 0; j < buckets[i]; j++, outI++) {
                    this.write(outI, i);
                    await this.clear();
                }
            }
        }
    },
    radixSort: class extends Algorithm {
        async execute() {
            let maximumDigitCount = Math.trunc(Math.log10(this.count)) + 1;

            //console.log("Digit", maximumDigitCount)

            for (let i = 0; i < maximumDigitCount; i++) {
                let magitude = 10 ** i;
                //console.log("magnitude: ", magitude)

                const buckets = new Array(10).fill(0);
                const b = new Array(this.count).fill(0);

                //Count the number of times each digit appears
                for (let j = 0; j < this.count; j++) {
                    buckets[Math.trunc((this.read(j) / magitude) % 10)]++;
                    await this.clear();
                }

                //console.log("buckets ", buckets)
                for (let j = 1; j < 10; j++)
                    buckets[j] += buckets[j - 1];


                for (let j = this.count - 1; j >= 0; j--) {
                    let value = this.read(j);
                    let bucketIndex = Math.trunc((value / magitude) % 10);

                    b[Math.trunc(buckets[bucketIndex]) - 1] = value;
                    buckets[bucketIndex]--;
                    await this.clear();
                }

                for (let j = 0; j < this.count; j++) {

                    this.write(j, b[j]);
                    await this.clear();
                }
            }

        }
    },

}

export default algortithms;