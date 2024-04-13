// Packages
const express = require("express");
const app = express();
const fs = require("fs");
const winston = require("winston");

/**
 * Logging levels specified by RFC5424, used by libraries such as `winston`, are as follows:
 * 
 * const levels = {
 *  error: 0,
 *  warn: 1,
 *  info: 2,
 *  http: 3,
 *  verbose: 4,
 *  debug: 5,
 *  silly: 6
 * }
 * 
 * This information can be 
 */
// 

// Environment variables and loggers
const port = process.env.port || 3000;
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta:  { service: 'calculator-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error'}),
        new winston.transports.File({ filename: 'combined.log' })
    ]
})

// Calculator functions
const add = (nums) => {
    return nums[0] + nums[1];
}
const subtract = (nums) => {
    return nums[0] - nums[1];
}
const multiply = (nums) => {
    return nums[0] * nums[1];
}
const divide = (nums) => {
    return nums[0] / nums[1];
}
const power = (nums) => {
    return nums[0] ** nums[1];
}
const root = (nums) => {
    return nums[0] ** (1 / nums[1] );
}
const mod = (nums) => {
    return nums[0] % nums[1];
}
const quad = (nums) => {
    return nums[1] * nums[0]**2 + nums[2] * nums[0] + nums[3];
}

// Helper function to create an ordinal number string from a number,
// e.g. "1st" from 1, "2nd" from 2, "3rd" from 3, "4th" from 4, etc.
// const numberSuffixer = (num) => {
//     // Numbers between 4 and 20 all end in "th"
//     if (num >= 4 && num <= 20) {
//         console.log('Number >=4 & <= 20')
//         return num + 'th';
//     }
//     // Otherwise, check the trailing digit
//     switch (num % 10) {
//         case 1:
//             console.log("Case 1 reached");
//             return num + "st";
//         case 2:
//             return num + "nd";
//         case 3:
//             return num + "rd"
//         default:
//             console.log("Default case reached");
//             return num + "th";
//     }
// };

// Helper function to validate URL parameters as floating point numbers.
// Parses an arbitrary number of strings in an array
// Returns an array of floats if all pass; if any fail, the first
// one will be logged, and an error message will be returned as a 
// string.
// const validateParamsAsFloats = (params) => {
//     let nums = [];
//     let num;
//     for (let i = 0; i < params.length; i++) {
//         num = parseFloat(params[i]);
//         if (isNaN(num)) {
//             const nth = numberSuffixer(i + 1);
//             return `Invalid number '${params[i]}' received for ${nth} parameter`;
//         }
//         nums.push(num);z
//     }
//     return nums;
// }

// Generic calculator HTTP request and response function
const calculate = (req, res, fun) => {
    try {
        // Iterate over parameters in query URL and try and cast each one to float
        let nums = [];
        let num;
        console.log(req.query);
        for (let propName in req.query) {
            if (req.query.hasOwnProperty(propName)) {
                console.log(req.query[propName]);
                num = parseFloat(req.query[propName]);
                if (isNaN(num)) {
                    logger.error(`Invalid number '${req.query[propName]}' received for parameter '${propName}' in function ${fun.name}.`);
                    throw new Error(`Invalid number '${req.query[propName]}' received for parameter '${propName}'.`);
                };
                nums.push(num);
            }

        }
    
        // If the parameters are OK (i.e. no error was thrown), subtract n2 from n1 and return the result
        logger.info(`Numbers ${nums.toString()} received for function ${fun.name}.`);
        const result = fun(nums);
        res.status(200).json({ statuscode: 200, data: result });

    } catch (error) {
        console.error(error);
        res.status(500).json({statuscode: 500, msg: error.toString() });
    }
};

// Endpoints
// Adds n1 and n2 and returns their sum
// Usage: http://localhost:3000/add?n1=1&n2=5
app.get("/add", (req, res) => {
    calculate(req, res, add);
});

// Subtracts n2 from n1 and returns this result
// Usage: http://localhost:3000/subtract?n1=1&n2=5
app.get("/subtract", (req, res) => {
    calculate(req, res, subtract);
});

// Multiplies n1 by n2 and returns this result
// Usage: http://localhost:3000/mulitply?n1=1&n2=5
app.get("/multiply", (req, res) => {
    calculate(req, res, multiply);
});

// Divides n1 by n2 and returns this result
// Usage: http://localhost:3000/divide?n1=1&n2=5
app.get("/divide", (req, res) => {
    // Specialised error handling for divide by zero error
    try {
        if (parseFloat(req.query.n2) == 0) {
            logger.error("Parameter n2 is zero. Unable to divide by zero");
            throw new Error("Parameter n2 is zero. Unable to divide by zero");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({statuscode: 500, msg: error.toString() });
    }
    calculate(req, res, divide);
});

// Raises n1 to the n2th power and returns the result
// Usage: http://localhost:3000/power?n1=1&n2=5
app.get("/power", (req, res) => {
    calculate(req, res, power);
});

// Calculates the n2th root of n1 and returns the result
// Usage: http://localhost:3000/root?n1=1&n2=5
app.get("/root", (req, res) => {
    // Specialised error handling for even roots
    try {
        // n1 can't be negative if n2 is an even root
        if ( (parseFloat(req.query.n2) % 2 == 0) && (parseFloat(req.query.n1) < 0) ) {
            logger.error("Negative n1 is not possible for even roots (i.e. even n2)");
            throw new Error("Negative n1 is not possible for even roots (i.e. even n2)");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({statuscode: 500, msg: error.toString() });
    }
    calculate(req, res, root);
});

// Raises n1 % n2 and returns the result
// Usage: http://localhost:3000/mod?n1=1&n2=5
app.get("/mod", (req, res) => {
    calculate(req, res, mod);
});

// Showing how my validation function can handle more than two parameters, with a simple quadratic evaluator
// Usage: http://localhost:3000/quad?x=5&a=2&b=1&c=6 for fn y = 2x^2 + x + 6 at x = 5
app.get("/quad", (req, res) => {
    calculate(req, res, quad);
})

app.listen(port, () => {
    console.log("App listening on port", port);
});
