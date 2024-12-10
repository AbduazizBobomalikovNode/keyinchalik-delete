function createUniqueRandomGenerator(num) {
    if (num) {
        let binaryInteger = parseInt(parseInt(Math.random() * 10) * 10 ** 12 + (parseInt((parseInt(Math.random() * 10 ** 12) + "").split('').reverse().join('')) + (new Date()).valueOf()));
        if (`${binaryInteger}`.length > 13) {
            return createUniqueRandomGenerator(num);
        }
        let result = parseInt(binaryInteger + Math.random() * 10 ** 8) % 10 ** (num + 1);
        if (`${result}`.length != num) {
            return createUniqueRandomGenerator(num);
        }
        return result;
    } else {
        let binaryInteger = parseInt(parseInt(Math.random() * 10) * 10 ** 12 + (parseInt((parseInt(Math.random() * 10 ** 12) + "").split('').reverse().join('')) + (new Date()).valueOf()));
        if (`${binaryInteger}`.length > 13) {
            return createUniqueRandomGenerator();
        }
        let result = parseInt(binaryInteger + Math.random() * 10 ** 8) % 10 ** 9;
        if (`${result}`.length != 8) {
            return createUniqueRandomGenerator();
        }
        return result;
    }
}
module.exports = createUniqueRandomGenerator;