import { z } from "zod";

export const validateRequest = (schema) => async (req, res, next) => {
  try {
    const validData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Replace req properties with validated (and optionally typed/stripped) data
    req.body = validData.body;
    req.query = validData.query;
    req.params = validData.params;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.errors.map(e => ({
          path: e.path.join("."),
          message: e.message
        }))
      });
    }
    next(error);
  }
};
