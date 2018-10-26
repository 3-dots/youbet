rm index.zip
cd lambda
npm i
zip -r -X ../index.zip *
cd ..
aws lambda update-function-code --function-name Alexa_YouBet --zip-file fileb://index.zip
