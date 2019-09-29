

exports.checkMandatoryParameters = (argv, mandatoryParams) => {
    return mandatoryParams.map((p) => argv[p]).filter(v => v).reduce((a, v) => a + 1, 0) === mandatoryParams.length;
};