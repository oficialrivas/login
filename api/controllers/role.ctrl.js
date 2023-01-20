'use strict';
const Role = require('../services/role.service');
const { ValidationError } = require('../helpers/errors');

const controllers = {
  create: async (req, res) => {
    try {
      const role = await Role.create(req.body);
      return res.status(200).send({ status: 1, message: 'success', role });
    } catch (err) {
      if (err instanceof ValidationError)
        return res.status(err.code).json({
          status: 0,
          errors: [
            {
              msg: err.message,
            },
          ],
        });
      return res.status(500).send({ error: `Error in register => ${err}` });
    }
  },
  get_all: async (req, res) => {
    const roles = await Role.findAll();
    return res.json({ status: 1, roles });
  },
  set_default: async (req, res) => {
    await Role.setDefault(req.params.id);
    return res.json({
      status: 1,
      message: `Role ${req.params.id} set as default`,
    });
  },
};

module.exports = controllers;
