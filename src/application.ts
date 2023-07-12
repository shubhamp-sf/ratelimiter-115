import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {CoreComponent, SFCoreBindings, SecureSequence} from '@sourceloop/core';
import {AuthenticationComponent} from 'loopback4-authentication';
import {
  AuthorizationBindings,
  AuthorizationComponent,
} from 'loopback4-authorization';
import {RateLimitSecurityBindings} from 'loopback4-ratelimiter';
import path from 'path';
import {RedisDataSource} from './datasources';
import * as openapi from './openapi.json';

export {ApplicationConfig};

export class RatelimiterIssueReproductionApp extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.sequence(SecureSequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.bind(RateLimitSecurityBindings.CONFIG).to({
      name: RedisDataSource.dataSourceName,
      type: 'RedisStore',
      max: 5,
      windowMs: 50000,
      skip: (request, response) => {
        return !!request.path.match(/\/obf\/.+/gm);
      },
    });

    this.bind(AuthorizationBindings.CONFIG).to({
      allowAlwaysPaths: ['/', '/explorer', '/openapi.json'],
    });

    this.bind(SFCoreBindings.config).to({
      enableObf: true,
      obfPath: '/obf',
      openapiSpec: openapi,
      // authenticateSwaggerUI: true,
      // swaggerUsername: 'shubham',
      // swaggerPassword: 'secret',
    });

    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    this.component(CoreComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
