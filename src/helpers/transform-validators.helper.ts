import { BadRequestException } from '@nestjs/common';
import { TransformFnParams } from 'class-transformer';

export function isBoolean({ value, key }: TransformFnParams) {
  // possible bool types
  const booleanTypes = [0, 1, true, false];

  // check if passed param is not a bool type
  if (!booleanTypes.some((type) => type.toString() === value)) {
    throw new BadRequestException(`${key} must be a boolean`);
  }

  // check if it's a true value
  return (
    value === booleanTypes[0].toString() || value === booleanTypes[2].toString()
  );
}
