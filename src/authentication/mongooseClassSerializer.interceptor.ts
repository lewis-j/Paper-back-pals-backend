//https://wanago.io/2021/08/23/api-nestjs-relationships-mongodb/
//https://github.com/jmcdo29

import {
  ClassSerializerInterceptor,
  PlainLiteralObject,
  Type,
} from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Document } from 'mongoose';

function MongooseClassSerializerInterceptor(
  classToIntercept: Type,
): typeof ClassSerializerInterceptor {
  return class Interceptor extends ClassSerializerInterceptor {
    private changePlainObjectToClass(document: PlainLiteralObject) {
      if (!(document instanceof Document)) {
        return document;
      }

      const plainInstance = plainToInstance(
        classToIntercept,
        document.toJSON(),
      );
      return plainInstance;
    }

    private prepareResponse(
      response: PlainLiteralObject | PlainLiteralObject[],
    ) {
      if (Array.isArray(response)) {
        return response.map(this.changePlainObjectToClass);
      }

      return this.changePlainObjectToClass(response);
    }

    serialize(
      response: PlainLiteralObject | PlainLiteralObject[],
      options: ClassTransformOptions,
    ) {
      // console.log('PlainLiteralObject', response);
      const res = super.serialize(this.prepareResponse(response), options);
      return res;
    }
  };
}

export default MongooseClassSerializerInterceptor;
