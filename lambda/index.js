exports.handler = async (event) => {
    // TODO implement
    console.log('= = = = = = = = = = = = = = = =  = = = =')
    console.log(JSON.stringify(event))
    console.log('= = = = = = = = = = = = = = = =  = = = =')
    const response = {
        statusCode: 200,
        body: event
    };
    return response;
};