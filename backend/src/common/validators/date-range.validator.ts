import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsEndDateGteStartDate(
  startField: string,
  endField: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isEndDateGteStartDate',
      target: (object as any).constructor,
      propertyName,
      constraints: [startField, endField],
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const [startKey, endKey] = args.constraints as [string, string];
          const start = (args.object as any)[startKey];
          const end = (args.object as any)[endKey];
          if (!start || !end) return true;
          const s = new Date(start).getTime();
          const e = new Date(end).getTime();
          if (!isFinite(s) || !isFinite(e)) return false;
          return e >= s;
        },
        defaultMessage(args: ValidationArguments) {
          const [startKey, endKey] = args.constraints as [string, string];
          return `${endKey} must be greater than or equal to ${startKey}`;
        },
      },
    });
  };
}
