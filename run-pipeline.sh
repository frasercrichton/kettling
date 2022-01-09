#!/bin/bash
echo "Run Kettling pipeline"
aws codepipeline start-pipeline-execution --name frasercrichton-com-kettling
aws cloudfront create-invalidation --distribution-id EYLFA9OG0T7L9 --paths "/*" 

# aws codepipeline get-pipeline-state --name frasercrichton-com-kettling
