import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Template, Capture } from 'aws-cdk-lib/assertions';
import { HitCounter } from '../lib/hitcounter';
import { Stack } from "aws-cdk-lib/core/lib/stack";

describe('hitcounter', () => {
  const testStack = new cdk.Stack();

  const getTestLambda = (testStack: Stack, lambdaId: string) => {
    return new lambda.Function(testStack, lambdaId, {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });
  }

  test('DynamoDB Table Created', () => {
    const testLambda = getTestLambda(testStack, 'TestFunction 1');

    new HitCounter(testStack, 'MyTestConstruct 1', { downstream: testLambda });

    const template = Template.fromStack(testStack);

    template.resourceCountIs("AWS::DynamoDB::Table", 1);
  });

  test('Lambda Has Environment Variables', () => {
    const testLambda = getTestLambda(testStack, 'TestFunction 2');

    new HitCounter(testStack, 'MyTestConstruct 2', { downstream: testLambda });

    const template = Template.fromStack(testStack);

    const envCapture = new Capture();

    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: envCapture,
    });

    expect(envCapture.asObject()).toEqual(
      {
        Variables: {
          DOWNSTREAM_FUNCTION_NAME: {
            Ref: "TestFunction1DB4527A7",
          },
          HITS_TABLE_NAME: {
            Ref: "MyTestConstruct1Hits704B2C48",
          },
        },
      }
    );
  });

  test('DynamoDB Table Created With Encryption', () => {
    const testLambda = getTestLambda(testStack, 'TestFunction 3');

    new HitCounter(testStack, 'MyTestConstruct 3', { downstream: testLambda });

    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: {
        SSEEnabled: true,
      }
    });
  });

  test('read capacity can be configured', () => {
    const testLambda = getTestLambda(testStack, 'TestFunction 4');

    expect(() => {
      new HitCounter(testStack, 'MyTestConstruct 4', {
        downstream:  testLambda,
        readCapacity: 3,
      });
    }).toThrowError(/readCapacity must be greater than 5 and less than 20/);
  });
})

