export enum AstNodeType {
  NUMBER = "NUMBER",
  STRING = "STRING",

  PLUS_OP = "PLUS_OP",
  MINUS_OP = "MINUS_OP",
  TIMES_OP = "TIMES_OP",
  DIV_OP = "DIV_OP",
  POW_OP = "POW_OP",
  NEGATIVE_OP = "NEGATIVE_OP",
  POSITIVE_OP = "POSITIVE_OP",
  AND_OP = "AND_OP",

  FUNCTION_CALL = "FUNCTION_CALL",

  RELATIVE_CELL = "RELATIVE_CELL",
  ABSOLUTE_CELL = "ABSOLUTE_CELL",
  MIXED_CELL = "MIXED_CELL",

  CELL_RANGE = "CELL_RANGE",

  ARRAY = "ARRAY"
}
