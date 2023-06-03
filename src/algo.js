import BarGraph from './bar-graph'
import { createRef } from 'react'

class Algorithm {
    constructor(barGraph, count) {
        this.swap = barGraph.swap;
        this.compare = barGraph.compare;
        this.clear = barGraph.clear;
        this.read = barGraph.read;
        this.write = barGraph.write;
        this.count = barGraph.size;
    }

    static name = null;
    static code = [];

    * execute() { }
}

const algorithms = {
    bubbleSort: class extends Algorithm {
        static name = "Bubble Sort";

        static code = [
            "1. for (let unorderedCount = count; unorderedCount > 0; unorderedCount--):",
            "2.   for (let i = 0; i < unorderedCount; ++i):",
            "3.       if (compare(i, i+1) > 0):",
            "4.           swap(i, i+1)"
        ];
        
        * execute() {
            for (let unorderedCount = this.count; unorderedCount > 0; unorderedCount--) {
                yield 0;
                for (let i = 0; i < unorderedCount; ++i) {
                    //yield 1;
                    if (this.compare(i+1, i) < 0) {
                        yield 2;
                        this.swap(i+1, i);
                        yield 3;
                    } else {
                        yield 2;
                    }
                }
            }
            
            /*let index = 0;
            let unorderedCount = this.count;
            
            while (unorderedCount > 0) {
                if (index + 1 >= unorderedCount) {
                    index = 0
                    unorderedCount--;
                }
                if (this.compare(index + 1, index) < 0) {
                    this.swap(index + 1, index);
                }
                index++;

                yield;
            }*/
        }
        
    },
    //Bring the smallest bars to the right
    selectionSort: class extends Algorithm {
        static name = "Selection Sort";

        * execute() {
            let index = 0;
            let firstUnorderedIndex = 0;
            let minIndex = 0;

            while (firstUnorderedIndex < this.count) {
                if (index >= this.count) {
                    this.swap(firstUnorderedIndex, minIndex);
                    yield;
                    firstUnorderedIndex++;
                    index = minIndex = firstUnorderedIndex;
                }

                if (this.compare(index, minIndex) < 0)
                    minIndex = index;
                index++;

                yield;
                this.clear();
            }
        }
    },
    //Bubble sort by adding numbers one by one
    insertionSort: class extends Algorithm {
        static name = "Insertion Sort";

        * execute() {
            let index = 1;
            let firstUnorderedIndex = 1;

            while (firstUnorderedIndex <= this.count) {
                if (index > 0 && this.compare(index, index - 1) < 0) {
                    this.swap(index, index - 1);
                    index--;
                } else {
                    index = firstUnorderedIndex++;
                }

                yield;
                this.clear();
            }
        }
    },
    mergeSort: class extends Algorithm {
        static name = "Merge Sort";

        constructor(barGraph, count) {
            super(barGraph, count);

            // A barGraph that we will use as the external memory
            // where we temporaly store sorted ranges.
            this.external_mem_ref = createRef();
            this.secondaryUI = (
                <BarGraph
                    ref={this.external_mem_ref}
                    name="External memory"
                    hideCounters
                    color="gray"
                    initialValues={(x) => 0}
                    count={count}/>
            );
        }

        * execute() {
            this.externalMemory = this.external_mem_ref.current;

            let size = 1;
            let left = 0;

            while (size < this.count - 1) {
                if (left >= this.count - 1) {
                    size *= 2;
                    left = 0;
                }
                let mid = Math.min(left + size - 1, this.count - 1);
                let right = Math.min(left + 2 * size - 1, this.count - 1);

                yield* this.merge(left, mid, right);
                this.externalMemory.clear();

                left += size * 2;
            }
        }

        * merge(left, middle, right) {
            let mergedI = 0;

            let i = left;
            let j = middle + 1;

            while (i <= middle && j <= right) {
                if (this.compare(i, j) < 0) {
                    this.externalMemory.write(mergedI, this.read(i));
                    i++;
                } else {
                    this.externalMemory.write(mergedI, this.read(j));
                    j++;
                }
                mergedI++;
                yield;
            }
            while (i <= middle) {
                this.externalMemory.write(mergedI, this.read(i));
                i++;
                mergedI++;
                yield;
            }
            while (j <= right) {
                this.externalMemory.write(mergedI, this.read(j));
                j++;
                mergedI++;
                yield;
            }

            for (let i = 0; i < mergedI; ++i) {
                this.write(left+i, this.externalMemory.read(i));
                yield;
            }
        }
    },
    quickSort: class extends Algorithm {
        static name = "Quick Sort (fixed pivot)";

        * partition(left, right) {
            //let pivot = Math.floor((left+right)/2);
            let pivot = right;

            let i = left;
            let minIndex = left;

            while (i < right) {
                if (this.compare(i, pivot) < 0) {
                    this.swap(i, minIndex);
                    minIndex++;
                }
                i++;
                yield;
                //this.clear();
            }
            this.swap(minIndex, pivot);
            yield;
            //this.clear();

            return minIndex; //The current index of the pivot, as they were swaped.
        }

        * execute() {
            const stack = [0, this.count - 1];

            while (stack.length > 0) {
                let right = stack.pop();
                let left = stack.pop();
                let pivotIndex = yield* this.partition(left, right);

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
        static name = "Counting Sort";

        constructor(barGraph, count) {
            super(barGraph, count);

            // A barGraph that will store the frequencies of each number.
            this.external_mem_ref = createRef();
            this.secondaryUI = (
                <BarGraph
                    ref={this.external_mem_ref}
                    name="Frequency map"
                    hideCounters
                    color="gray"
                    initialValues={(x) => 0}
                    count={count}/>
            );
        }

        * execute() {
            this.externalMemory = this.external_mem_ref.current;

            //Each bucket stores the frecuency of each number. As such, the number of needed
            //buckets equals the maximum number, which in this case is equal to the array length.
            //The memory needed to do counting sort increases linearly with the maximum number.
            //But there are alternatives:
            //- Radix sort: buckets store the frecuency of each digit.
            //- Bucket sort:
            //In depth explaining: https://stackoverflow.com/questions/14368392/radix-sort-vs-counting-sort-vs-bucket-sort-whats-the-difference
            let maximumNumber = this.count;

            for (let i = 0; i < maximumNumber; ++i)
                this.externalMemory.write(i, 0);
            this.externalMemory.clear();
            yield;

            for (let i = 0; i < maximumNumber; i++) {
                let bucketIdx = this.read(i) - 1;
                let tmp = this.externalMemory.read(bucketIdx);
                this.externalMemory.write(bucketIdx, tmp+1);
                yield;
            }

            for (let i=0, outI = 0; i < maximumNumber; ++i) {
                let bucketValue = this.externalMemory.read(i);
                for (let j = 0; j < bucketValue; ++j, ++outI) {
                    this.write(outI, i+1);
                    yield;
                }
            }
        }
    },
    radixSort: class extends Algorithm {
        static name = "Radix Sort";

        * execute() {
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
                    yield;
                    this.clear();
                }

                //console.log("buckets ", buckets)
                for (let j = 1; j < 10; j++)
                    buckets[j] += buckets[j - 1];

                for (let j = this.count - 1; j >= 0; j--) {
                    let value = this.read(j);
                    let bucketIndex = Math.trunc((value / magitude) % 10);

                    b[Math.trunc(buckets[bucketIndex]) - 1] = value;
                    buckets[bucketIndex]--;
                    yield;
                    this.clear();
                }

                for (let j = 0; j < this.count; j++) {
                    this.write(j, b[j]);
                    yield;
                    this.clear();
                }
            }

        }
    },
}

export { Algorithm, algorithms };