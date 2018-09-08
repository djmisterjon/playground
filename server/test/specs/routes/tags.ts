import * as CODES from 'http-codes';
import * as supertest from 'supertest';
import { suite, test } from 'mocha-typescript';
import { expect } from 'chai';
import { request, clearDb } from '../../fixtures/server';
import { Tag } from '../../../src/models/Tag';
import { ITag } from '../../../../shared/types';

const testTagData: ITag = {
    name: 'test',
};

function createTag()
{
    return (new Tag(testTagData)).save();
}

@suite('/api/tag - READ')
class ReadRoutes
{
    static before()
    {
        return clearDb().then(() => createTag());
    }

    @test 'GET search should return 1 result'()
    {
        return request.get(`/api/tags?q=test`)
            .expect(CODES.OK)
            .expect((res: supertest.Response) =>
            {
                expect(res.body).to.be.an('array').with.length(1);
                checkTagData(res.body[0]);
            });
    }

    @test 'GET should return the test tag'()
    {
        return request.get(`/api/tag/1`)
            .expect(CODES.OK)
            .expect(confirmTagResponse());
    }
}

@suite('/api/tag - READ ERRORS')
class ReadRouteErrors
{
    static before()
    {
        return clearDb();
    }

    @test 'GET search with no results should return 404'()
    {
        return request.get('/api/tags?q=nope')
            .expect(CODES.NOT_FOUND);
    }

    @test 'GET empty search query should return 422'()
    {
        return request.get('/api/tags?q=')
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'GET non-existant id should return 404'()
    {
        return request.get('/api/playground/0')
            .expect(CODES.NOT_FOUND);
    }
}

@suite('/api/tag - WRITE')
class WriteRoutes
{
    static before()
    {
        return clearDb().then(() => createTag());
    }

    @test 'POST creates a new tag'()
    {
        return request.post('/api/tag')
            .send(testTagData)
            .expect(CODES.CREATED)
            .expect(confirmTagResponse())
            .then((res) =>
            {
                const item = res.body;

                return request.get(`/api/tag/${item.id}`)
                    .expect(CODES.OK)
                    .expect(confirmTagResponse());
            });
    }

    @test 'PUT updates a tag'()
    {
        const name = 'new-name';

        return request.put('/api/tag/1')
            .send({ name })
            .expect(CODES.OK)
            .expect((res: supertest.Response) =>
            {
                expect(res.body).to.have.property('name', name);
            });
    }
}

@suite('/api/tag - WRITE ERRORS')
class WriteRouteErrors
{
    static before()
    {
        return clearDb().then(() => createTag());
    }

    @test 'POST without name returns 422'()
    {
        return request.post('/api/tag')
            .send({})
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }

    @test 'PUT without name returns 422'()
    {
        return request.put('/api/tag/1')
            .send({})
            .expect(CODES.UNPROCESSABLE_ENTITY);
    }
}

function confirmTagResponse()
{
    return (res: supertest.Response) =>
    {
        checkTagData(res.body);
    };
}

function checkTagData(item: ITag)
{
    expect(item).to.have.property('name', testTagData.name);
}
