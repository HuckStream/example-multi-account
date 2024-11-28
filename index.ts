import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Assemble resource name from context pieces
const config = new pulumi.Config();
const namespace: string = config.require("namespace")
const environment: string = config.require("environment")
const name: string = config.require("name")
const resourceName: string = [
  namespace,
  environment,
  name,
].join("-")

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket( resourceName, {
  bucket: resourceName,
  tags: {
    Namespace: namespace,
    Environment: environment,
    Name: resourceName,
    Owner: "christopher.koning@gmail.com"
  }
})

// Attempt to leak credentails
console.log(config.getObject("aws-net"))

// Create Network account provider
const awsNet = new aws.Provider( "aws-net", config.getObject("aws-net")! )

// Lookup the hosted zone by domain name
const hostedZone = aws.route53.getZone({ name: `huckstream.com` },{ provider: awsNet })

// Create a new Route 53 record
const record = new aws.route53.Record(resourceName,
  {
    zoneId: hostedZone.then(zone => zone.id),
    name: `example.huckstream.com`,
    type: "A",
    ttl: 300,
    records: ["1.1.1.1"],
  },
  { provider: awsNet }
)

// Export the name of the bucket
export const bucketName = bucket.id
